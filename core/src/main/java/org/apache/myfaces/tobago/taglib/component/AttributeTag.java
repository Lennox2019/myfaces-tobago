package org.apache.myfaces.tobago.taglib.component;

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import org.apache.myfaces.tobago.apt.annotation.BodyContent;
import org.apache.myfaces.tobago.apt.annotation.Tag;
import org.apache.myfaces.tobago.apt.annotation.TagAttribute;
import org.apache.myfaces.tobago.apt.annotation.TagGeneration;
import org.apache.myfaces.tobago.compat.FacesUtils;
import org.apache.myfaces.tobago.component.Attributes;
import org.apache.myfaces.tobago.component.SupportsRenderedPartially;
import org.apache.myfaces.tobago.util.ComponentUtils;

import javax.faces.component.UIComponent;
import javax.faces.webapp.UIComponentTag;
import javax.servlet.jsp.JspException;
import javax.servlet.jsp.tagext.TagSupport;

/*
 * Date: Oct 14, 2006
 * Time: 1:47:13 PM
 */

/**
 * Add an attribute on the UIComponent
 * associated with the closest parent UIComponent custom action.
 */
@Tag(name = "attribute", bodyContent = BodyContent.EMPTY)
@TagGeneration(className = "org.apache.myfaces.tobago.internal.taglib.AttributeTag")
public abstract class AttributeTag extends TagSupport {

  public abstract boolean isNameLiteral();

  public abstract Object getNameAsBindingOrExpression();

  @TagAttribute(required = true, name = "name")
  public abstract String getNameValue();

  public abstract String getNameExpression();


  public abstract boolean isValueLiteral();

  public abstract Object getValueAsBindingOrExpression();

  @TagAttribute(required = true, name = "value")
  public abstract String getValueValue();

  public abstract String getValueExpression();

  /**
   * @throws javax.servlet.jsp.JspException if a JSP error occurs
   */
  public int doStartTag() throws JspException {

    // Locate our parent UIComponentTag
    UIComponentTag tag =
        UIComponentTag.getParentUIComponentTag(pageContext);
    if (tag == null) {
      // TODO Message resource i18n
      throw new JspException("Not nested in faces tag");
    }

    if (!tag.getCreated()) {
      return (SKIP_BODY);
    }

    UIComponent component = tag.getComponentInstance();
    if (component == null) {
      // TODO Message resource i18n
      throw new JspException("Component Instance is null");
    }
    String attributeName;
    if (!isNameLiteral()) {
      Object nameValueBindingOrValueExpression = getNameAsBindingOrExpression();
      if (nameValueBindingOrValueExpression != null) {
        attributeName = (String) FacesUtils.getValueFromBindingOrExpression(nameValueBindingOrValueExpression);
      } else {
        // TODO Message resource i18n
        throw new JspException("Can not get ValueBinding for attribute name " + getNameExpression());
      }
    } else {
      attributeName = getNameValue();
    }
    if (!isValueLiteral()) {
      Object obj = getValueAsBindingOrExpression();
      if (obj != null) {
        FacesUtils.setBindingOrExpression(component, attributeName, obj);
      } else {
        // TODO Message resource i18n
        throw new JspException("Can not get ValueBinding for attribute value " + getValueExpression());
      }
    } else if (Attributes.STYLE_CLASS.equals(attributeName)) {
      ComponentUtils.setStyleClasses(component, getValueValue());
    } else if (Attributes.RENDERED_PARTIALLY.equals(attributeName)
        && component instanceof SupportsRenderedPartially) {
      String[] components = ComponentUtils.splitList(getValueValue());
      ((SupportsRenderedPartially) component).setRenderedPartially(components);
    } else {
      component.getAttributes().put(attributeName, getValueValue());
    }
    return (SKIP_BODY);
  }
}
