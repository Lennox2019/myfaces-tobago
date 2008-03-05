package org.apache.myfaces.tobago.layout.grid;

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

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.myfaces.tobago.component.LayoutTokens;
import org.apache.myfaces.tobago.layout.LayoutComponent;
import org.apache.myfaces.tobago.layout.LayoutContainer;
import org.apache.myfaces.tobago.layout.LayoutManager;

import java.util.List;

/**
 * User: lofwyr
 * Date: 24.01.2008 13:36:21
 */
public class GridLayoutManager implements LayoutManager {

  private static final Log LOG = LogFactory.getLog(GridLayoutManager.class);

  private Grid grid;

  private LayoutTokens rowTokens;
  private LayoutTokens columnTokens;

  public GridLayoutManager(String rowsString, String columnsString) {

    rowTokens = LayoutTokens.parse(rowsString);
    columnTokens = LayoutTokens.parse(columnsString);

    grid = new Grid(columnTokens.getSize(), rowTokens.getSize());
  }

  public void layout(LayoutContainer container) {

    List<LayoutComponent> components = container.getComponents();

    distributeCells(components);

    distributeFixed(components);
    distributeAuto(components);
    distributeAsterisk(components);

  }

  private void distributeCells(List<LayoutComponent> components) {
    for (LayoutComponent component : components) {

      GridComponentConstraints constraints = GridComponentConstraints.getConstraints(component);
      grid.add(new ComponentCell(component), constraints.getColumnSpan(), constraints.getRowSpan());

      LOG.debug("\n" + grid);
    }
  }

  private void distributeFixed(List<LayoutComponent> components) {
/*
    Measure width = ?;

    for (Object token : columnTokens.) {

      if (token.isFix()) {
        width.substract(token.getSize());
      }

    }
*/
  }

  private void distributeAuto(List<LayoutComponent> components) {
    //To change body of created methods use File | Settings | File Templates.
  }

  private void distributeAsterisk(List<LayoutComponent> components) {
    //To change body of created methods use File | Settings | File Templates.
  }


}
